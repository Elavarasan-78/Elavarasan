package com.smartquiz.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeaderboardResponse {
    private int rank;
    private Long userId;
    private String username;
    private String userFullName;
    private Double totalScore;
    private Integer quizzesAttempted;
    private String subjectName;
}
