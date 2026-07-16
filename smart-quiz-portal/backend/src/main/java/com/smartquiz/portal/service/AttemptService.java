package com.smartquiz.portal.service;

import com.smartquiz.portal.dto.AnswerSubmitDto;
import com.smartquiz.portal.dto.QuizAttemptResponse;
import java.util.List;

public interface AttemptService {
    QuizAttemptResponse startAttempt(Long quizId, String username);
    QuizAttemptResponse submitAttempt(Long attemptId, List<AnswerSubmitDto> answers, String username);
    QuizAttemptResponse getAttemptResult(Long attemptId, String username);
    List<QuizAttemptResponse> getUserAttempts(String username);
    boolean canAttemptQuiz(Long quizId, String username);
}
