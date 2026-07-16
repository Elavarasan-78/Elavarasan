package com.smartquiz.portal.service.impl;

import com.smartquiz.portal.dto.AnswerSubmitDto;
import com.smartquiz.portal.dto.OptionDto;
import com.smartquiz.portal.dto.QuizAttemptResponse;
import com.smartquiz.portal.entity.*;
import com.smartquiz.portal.exception.BadRequestException;
import com.smartquiz.portal.exception.ResourceNotFoundException;
import com.smartquiz.portal.repository.*;
import com.smartquiz.portal.service.AttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptServiceImpl implements AttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final AnswerRepository answerRepository;
    private final ResultRepository resultRepository;
    private final LeaderboardRepository leaderboardRepository;
    private final SubjectRepository subjectRepository;

    @Override
    public boolean canAttemptQuiz(Long quizId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

        long completedAttempts = quizAttemptRepository.countByUserIdAndQuizIdAndIsCompleted(user.getId(), quizId, true);
        return completedAttempts < quiz.getMaxAttempts();
    }

    @Override
    @Transactional
    public QuizAttemptResponse startAttempt(Long quizId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

        if (!quiz.isPublished()) {
            throw new BadRequestException("This quiz is not published yet.");
        }

        long completedAttempts = quizAttemptRepository.countByUserIdAndQuizIdAndIsCompleted(user.getId(), quizId, true);
        if (completedAttempts >= quiz.getMaxAttempts()) {
            throw new BadRequestException("You have exhausted the maximum number of attempts for this quiz.");
        }

        List<Question> questions = questionRepository.findByQuizId(quizId);
        if (questions.isEmpty()) {
            throw new BadRequestException("This quiz has no questions yet.");
        }

        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .quiz(quiz)
                .startTime(LocalDateTime.now())
                .totalQuestions(questions.size())
                .attemptedQuestions(0)
                .correctAnswers(0)
                .wrongAnswers(0)
                .marksObtained(0.0)
                .percentage(0.0)
                .status("PENDING")
                .isCompleted(false)
                .build();

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return mapToResponse(saved, new ArrayList<>());
    }

    @Override
    @Transactional
    public QuizAttemptResponse submitAttempt(Long attemptId, List<AnswerSubmitDto> answers, String username) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));

        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Unauthorized access to this attempt.");
        }
        if (attempt.isCompleted()) {
            throw new BadRequestException("This attempt is already submitted.");
        }

        Quiz quiz = attempt.getQuiz();
        int correct = 0;
        int wrong = 0;
        int attempted = 0;
        double marksObtained = 0.0;

        List<Answer> savedAnswers = new ArrayList<>();

        for (AnswerSubmitDto submitDto : answers) {
            Question question = questionRepository.findById(submitDto.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + submitDto.getQuestionId()));

            Option selectedOption = null;
            boolean isCorrect = false;

            if (submitDto.getSelectedOptionId() != null) {
                selectedOption = optionRepository.findById(submitDto.getSelectedOptionId()).orElse(null);
                attempted++;
                if (selectedOption != null && selectedOption.isCorrect()) {
                    isCorrect = true;
                    correct++;
                    marksObtained += question.getMarks();
                } else {
                    wrong++;
                    marksObtained -= quiz.getNegativeMarks();
                }
            }

            Answer answer = Answer.builder()
                    .quizAttempt(attempt)
                    .question(question)
                    .selectedOption(selectedOption)
                    .isCorrect(isCorrect)
                    .build();
            savedAnswers.add(answerRepository.save(answer));
        }

        marksObtained = Math.max(0, marksObtained);
        double percentage = quiz.getTotalMarks() > 0 ? (marksObtained / quiz.getTotalMarks()) * 100 : 0;
        String status = marksObtained >= quiz.getPassMarks() ? "PASSED" : "FAILED";

        attempt.setAttemptedQuestions(attempted);
        attempt.setCorrectAnswers(correct);
        attempt.setWrongAnswers(wrong);
        attempt.setMarksObtained(marksObtained);
        attempt.setPercentage(percentage);
        attempt.setStatus(status);
        attempt.setCompleted(true);
        attempt.setEndTime(LocalDateTime.now());
        quizAttemptRepository.save(attempt);

        // Save Result
        Result result = Result.builder()
                .quizAttempt(attempt)
                .user(attempt.getUser())
                .quiz(quiz)
                .score(marksObtained)
                .percentage(percentage)
                .status(status)
                .build();
        resultRepository.save(result);

        // Update Leaderboard
        updateLeaderboard(attempt.getUser(), quiz.getSubject(), marksObtained);

        return mapToResponse(attempt, savedAnswers);
    }

    private void updateLeaderboard(User user, Subject subject, double score) {
        // Subject leaderboard
        Optional<Leaderboard> subjectBoard = leaderboardRepository.findByUserIdAndSubjectId(user.getId(), subject.getId());
        if (subjectBoard.isPresent()) {
            Leaderboard lb = subjectBoard.get();
            lb.setTotalScore(lb.getTotalScore() + score);
            lb.setQuizzesAttempted(lb.getQuizzesAttempted() + 1);
            leaderboardRepository.save(lb);
        } else {
            leaderboardRepository.save(Leaderboard.builder()
                    .user(user)
                    .subject(subject)
                    .totalScore(score)
                    .quizzesAttempted(1)
                    .build());
        }

        // Global leaderboard
        Optional<Leaderboard> globalBoard = leaderboardRepository.findByUserIdAndSubjectIsNull(user.getId());
        if (globalBoard.isPresent()) {
            Leaderboard lb = globalBoard.get();
            lb.setTotalScore(lb.getTotalScore() + score);
            lb.setQuizzesAttempted(lb.getQuizzesAttempted() + 1);
            leaderboardRepository.save(lb);
        } else {
            leaderboardRepository.save(Leaderboard.builder()
                    .user(user)
                    .subject(null)
                    .totalScore(score)
                    .quizzesAttempted(1)
                    .build());
        }
    }

    @Override
    public QuizAttemptResponse getAttemptResult(Long attemptId, String username) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));
        if (!attempt.getUser().getUsername().equals(username)) {
            throw new BadRequestException("Unauthorized access to this attempt.");
        }
        List<Answer> answers = answerRepository.findByQuizAttemptId(attemptId);
        return mapToResponse(attempt, answers);
    }

    @Override
    public List<QuizAttemptResponse> getUserAttempts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return quizAttemptRepository.findByUserId(user.getId()).stream()
                .map(a -> mapToResponse(a, new ArrayList<>()))
                .collect(Collectors.toList());
    }

    private QuizAttemptResponse mapToResponse(QuizAttempt attempt, List<Answer> answerList) {
        List<QuizAttemptResponse.AnswerDetailDto> answerDetails = answerList.stream().map(ans -> {
            Question q = ans.getQuestion();
            Option correctOpt = q.getOptions().stream().filter(Option::isCorrect).findFirst().orElse(null);
            List<OptionDto> optDtos = q.getOptions().stream().map(o -> {
                OptionDto od = new OptionDto();
                od.setId(o.getId());
                od.setOptionText(o.getOptionText());
                od.setCorrect(o.isCorrect());
                return od;
            }).collect(Collectors.toList());
            return QuizAttemptResponse.AnswerDetailDto.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .explanation(q.getExplanation())
                    .selectedOptionId(ans.getSelectedOption() != null ? ans.getSelectedOption().getId() : null)
                    .correctOptionId(correctOpt != null ? correctOpt.getId() : null)
                    .isCorrect(ans.isCorrect())
                    .options(optDtos)
                    .build();
        }).collect(Collectors.toList());

        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .quizId(attempt.getQuiz().getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .duration(attempt.getQuiz().getDuration())
                .totalMarks(attempt.getQuiz().getTotalMarks())
                .username(attempt.getUser().getUsername())
                .userFullName(attempt.getUser().getFullName())
                .startTime(attempt.getStartTime())
                .endTime(attempt.getEndTime())
                .totalQuestions(attempt.getTotalQuestions())
                .attemptedQuestions(attempt.getAttemptedQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .wrongAnswers(attempt.getWrongAnswers())
                .marksObtained(attempt.getMarksObtained())
                .percentage(attempt.getPercentage())
                .status(attempt.getStatus())
                .isCompleted(attempt.isCompleted())
                .answers(answerDetails)
                .build();
    }
}
