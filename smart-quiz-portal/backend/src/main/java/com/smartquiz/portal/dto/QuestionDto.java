package com.smartquiz.portal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class QuestionDto {
    private Long id;

    @NotBlank(message = "Question text is required")
    private String questionText;

    private String questionType = "MCQ";

    @NotNull(message = "Marks is required")
    private Integer marks = 1;

    private String explanation;

    @NotEmpty(message = "At least one option is required")
    private List<OptionDto> options;
}
