package com.smartquiz.portal.service;

import com.smartquiz.portal.dto.QuestionDto;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface QuestionService {
    List<QuestionDto> getQuestionsByQuiz(Long quizId);
    QuestionDto getQuestionById(Long id);
    QuestionDto createQuestion(Long quizId, QuestionDto dto);
    QuestionDto updateQuestion(Long id, QuestionDto dto);
    void deleteQuestion(Long id);
    
    // Bulk Operations
    void bulkUploadQuestions(Long quizId, MultipartFile file) throws IOException;
    byte[] exportQuestionsTemplate();
}
