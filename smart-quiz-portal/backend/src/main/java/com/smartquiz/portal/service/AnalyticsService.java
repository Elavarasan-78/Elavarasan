package com.smartquiz.portal.service;

import com.smartquiz.portal.dto.DashboardAnalyticsDto;
import com.smartquiz.portal.dto.LeaderboardResponse;
import java.util.List;

public interface AnalyticsService {
    DashboardAnalyticsDto getAdminDashboardAnalytics();
    List<LeaderboardResponse> getGlobalLeaderboard();
    List<LeaderboardResponse> getSubjectLeaderboard(Long subjectId);
}
