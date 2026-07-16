package com.smartquiz.portal.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizDto {
    private Long id;

    @NotBlank(message = "Quiz title is required")
    private String title;

    private String description;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer duration;

    @NotNull(message = "Total marks is required")
    private Integer totalMarks;

    @NotNull(message = "Negative marks coefficient is required")
    private Double negativeMarks = 0.0;

    @NotNull(message = "Pass marks is required")
    private Integer passMarks;

    private boolean shuffleQuestions = false;
    private boolean shuffleOptions = false;

    @NotNull(message = "Maximum attempts is required")
    @Min(value = 1, message = "Maximum attempts must be at least 1")
    private Integer maxAttempts = 1;

    private boolean isPublished = false;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    private String subjectName;
    private String categoryName;
    private Integer questionCount;
}
