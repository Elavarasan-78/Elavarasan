package com.smartquiz.portal.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class QuizAttemptResponse {
    private Long id;
    private Long quizId;
    private String quizTitle;
    private Integer duration;
    private Integer totalMarks;
    private String username;
    private String userFullName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer totalQuestions;
    private Integer attemptedQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;
    private Double marksObtained;
    private Double percentage;
    private String status;
    private boolean isCompleted;
    private List<AnswerDetailDto> answers;

    @Getter
    @Setter
    @Builder
    public static class AnswerDetailDto {
        private Long questionId;
        private String questionText;
        private String explanation;
        private Long selectedOptionId;
        private Long correctOptionId;
        private boolean isCorrect;
        private List<OptionDto> options;
    }
}
