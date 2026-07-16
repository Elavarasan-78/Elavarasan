package com.smartquiz.portal.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
public class DashboardAnalyticsDto {
    private long totalUsers;
    private long activeUsers;
    private long totalQuizzes;
    private long totalQuestions;
    private long totalAttempts;
    private double averageScore;
    private double passPercentage;
    
    private List<LeaderboardResponse> topPerformers;
    private List<ChartDataPoint> attemptsPerQuiz;
    private List<ChartDataPoint> scoresPerSubject;
    private List<ChartDataPoint> passFailStats; // PASSED vs FAILED count

    @Getter
    @Setter
    @Builder
    public static class ChartDataPoint {
        private String name;
        private double value;
        private double secondaryValue;
    }
}
