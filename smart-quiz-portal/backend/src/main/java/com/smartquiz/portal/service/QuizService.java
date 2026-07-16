package com.smartquiz.portal.service;

import com.smartquiz.portal.dto.QuizDto;
import java.util.List;

public interface QuizService {
    List<QuizDto> getAllQuizzes();
    List<QuizDto> getQuizzesBySubject(Long subjectId);
    List<QuizDto> getPublishedQuizzes();
    QuizDto getQuizById(Long id);
    QuizDto createQuiz(QuizDto dto);
    QuizDto updateQuiz(Long id, QuizDto dto);
    void deleteQuiz(Long id);
    QuizDto publishQuiz(Long id);
    QuizDto unpublishQuiz(Long id);
    QuizDto duplicateQuiz(Long id);
}
