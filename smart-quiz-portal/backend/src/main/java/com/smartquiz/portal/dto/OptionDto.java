package com.smartquiz.portal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OptionDto {
    private Long id;

    @NotBlank(message = "Option text is required")
    private String optionText;

    private boolean isCorrect;
}
