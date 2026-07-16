package com.smartquiz.portal.service.impl;

import com.smartquiz.portal.dto.QuizDto;
import com.smartquiz.portal.entity.*;
import com.smartquiz.portal.exception.ResourceNotFoundException;
import com.smartquiz.portal.repository.*;
import com.smartquiz.portal.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;

    @Override
    public List<QuizDto> getAllQuizzes() {
        return quizRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuizDto> getQuizzesBySubject(Long subjectId) {
        return quizRepository.findBySubjectId(subjectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<QuizDto> getPublishedQuizzes() {
        return quizRepository.findByIsPublished(true).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public QuizDto getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));
        return mapToDto(quiz);
    }

    @Override
    @Transactional
    public QuizDto createQuiz(QuizDto dto) {
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + dto.getSubjectId()));

        Quiz quiz = Quiz.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .duration(dto.getDuration())
                .totalMarks(dto.getTotalMarks())
                .negativeMarks(dto.getNegativeMarks())
                .passMarks(dto.getPassMarks())
                .shuffleQuestions(dto.isShuffleQuestions())
                .shuffleOptions(dto.isShuffleOptions())
                .maxAttempts(dto.getMaxAttempts())
                .isPublished(false)
                .subject(subject)
                .build();

        Quiz saved = quizRepository.save(quiz);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public QuizDto updateQuiz(Long id, QuizDto dto) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + dto.getSubjectId()));

        quiz.setTitle(dto.getTitle());
        quiz.setDescription(dto.getDescription());
        quiz.setDuration(dto.getDuration());
        quiz.setTotalMarks(dto.getTotalMarks());
        quiz.setNegativeMarks(dto.getNegativeMarks());
        quiz.setPassMarks(dto.getPassMarks());
        quiz.setShuffleQuestions(dto.isShuffleQuestions());
        quiz.setShuffleOptions(dto.isShuffleOptions());
        quiz.setMaxAttempts(dto.getMaxAttempts());
        quiz.setSubject(subject);

        Quiz updated = quizRepository.save(quiz);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteQuiz(Long id) {
        if (!quizRepository.existsById(id)) {
            throw new ResourceNotFoundException("Quiz not found with id: " + id);
        }
        quizRepository.deleteById(id);
    }

    @Override
    @Transactional
    public QuizDto publishQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));
        quiz.setPublished(true);
        Quiz saved = quizRepository.save(quiz);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public QuizDto unpublishQuiz(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));
        quiz.setPublished(false);
        Quiz saved = quizRepository.save(quiz);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public QuizDto duplicateQuiz(Long id) {
        Quiz original = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));

        Quiz duplicatedQuiz = Quiz.builder()
                .title("Copy of " + original.getTitle())
                .description(original.getDescription())
                .duration(original.getDuration())
                .totalMarks(original.getTotalMarks())
                .negativeMarks(original.getNegativeMarks())
                .passMarks(original.getPassMarks())
                .shuffleQuestions(original.isShuffleQuestions())
                .shuffleOptions(original.isShuffleOptions())
                .maxAttempts(original.getMaxAttempts())
                .isPublished(false)
                .subject(original.getSubject())
                .build();

        Quiz savedQuiz = quizRepository.save(duplicatedQuiz);

        // Fetch and duplicate questions
        List<Question> questions = questionRepository.findByQuizId(original.getId());
        for (Question originalQuestion : questions) {
            Question duplicatedQuestion = Question.builder()
                    .questionText(originalQuestion.getQuestionText())
                    .questionType(originalQuestion.getQuestionType())
                    .marks(originalQuestion.getMarks())
                    .explanation(originalQuestion.getExplanation())
                    .quiz(savedQuiz)
                    .options(new ArrayList<>())
                    .build();

            Question savedQuestion = questionRepository.save(duplicatedQuestion);

            // Duplicate options
            List<Option> duplicatedOptions = originalQuestion.getOptions().stream()
                    .map(originalOption -> Option.builder()
                            .optionText(originalOption.getOptionText())
                            .isCorrect(originalOption.isCorrect())
                            .question(savedQuestion)
                            .build())
                    .collect(Collectors.toList());

            optionRepository.saveAll(duplicatedOptions);
        }

        return mapToDto(savedQuiz);
    }

    private QuizDto mapToDto(Quiz quiz) {
        QuizDto dto = new QuizDto();
        dto.setId(quiz.getId());
        dto.setTitle(quiz.getTitle());
        dto.setDescription(quiz.getDescription());
        dto.setDuration(quiz.getDuration());
        dto.setTotalMarks(quiz.getTotalMarks());
        dto.setNegativeMarks(quiz.getNegativeMarks());
        dto.setPassMarks(quiz.getPassMarks());
        dto.setShuffleQuestions(quiz.isShuffleQuestions());
        dto.setShuffleOptions(quiz.isShuffleOptions());
        dto.setMaxAttempts(quiz.getMaxAttempts());
        dto.setPublished(quiz.isPublished());
        dto.setSubjectId(quiz.getSubject().getId());
        dto.setSubjectName(quiz.getSubject().getName());
        dto.setCategoryName(quiz.getSubject().getCategory().getName());
        dto.setQuestionCount((int) questionRepository.countByQuizId(quiz.getId()));
        return dto;
    }
}
