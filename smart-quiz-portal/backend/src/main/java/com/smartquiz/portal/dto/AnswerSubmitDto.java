package com.smartquiz.portal.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerSubmitDto {
    private Long questionId;
    private Long selectedOptionId; // can be null if skipped
}
