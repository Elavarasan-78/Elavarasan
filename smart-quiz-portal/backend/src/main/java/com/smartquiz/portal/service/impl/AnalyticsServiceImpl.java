package com.smartquiz.portal.service.impl;

import com.smartquiz.portal.dto.DashboardAnalyticsDto;
import com.smartquiz.portal.dto.LeaderboardResponse;
import com.smartquiz.portal.entity.Leaderboard;
import com.smartquiz.portal.repository.*;
import com.smartquiz.portal.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ResultRepository resultRepository;
    private final LeaderboardRepository leaderboardRepository;

    @Override
    public DashboardAnalyticsDto getAdminDashboardAnalytics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAll().stream().filter(u -> u.isActive()).count();
        long totalQuizzes = quizRepository.count();
        long totalQuestions = questionRepository.count();
        long totalAttempts = quizAttemptRepository.count();

        List<com.smartquiz.portal.entity.Result> allResults = resultRepository.findAll();
        double avgScore = allResults.stream().mapToDouble(r -> r.getPercentage()).average().orElse(0);
        long passedCount = allResults.stream().filter(r -> "PASSED".equals(r.getStatus())).count();
        double passPercentage = allResults.isEmpty() ? 0 : (passedCount * 100.0 / allResults.size());

        List<LeaderboardResponse> topPerformers = getGlobalLeaderboard().stream().limit(10).collect(Collectors.toList());

        // Attempts per quiz
        List<DashboardAnalyticsDto.ChartDataPoint> attemptsPerQuiz = quizRepository.findAll().stream().map(q -> {
            long attempts = quizAttemptRepository.findByQuizId(q.getId()).size();
            return DashboardAnalyticsDto.ChartDataPoint.builder()
                    .name(q.getTitle())
                    .value(attempts)
                    .build();
        }).limit(10).collect(Collectors.toList());

        // Pass/Fail
        List<DashboardAnalyticsDto.ChartDataPoint> passFailStats = List.of(
                DashboardAnalyticsDto.ChartDataPoint.builder().name("Passed").value(passedCount).build(),
                DashboardAnalyticsDto.ChartDataPoint.builder().name("Failed").value(allResults.size() - passedCount).build()
        );

        return DashboardAnalyticsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalQuizzes(totalQuizzes)
                .totalQuestions(totalQuestions)
                .totalAttempts(totalAttempts)
                .averageScore(Math.round(avgScore * 100.0) / 100.0)
                .passPercentage(Math.round(passPercentage * 100.0) / 100.0)
                .topPerformers(topPerformers)
                .attemptsPerQuiz(attemptsPerQuiz)
                .passFailStats(passFailStats)
                .build();
    }

    @Override
    public List<LeaderboardResponse> getGlobalLeaderboard() {
        List<Leaderboard> boards = leaderboardRepository.findBySubjectIsNullOrderByTotalScoreDesc();
        AtomicInteger rank = new AtomicInteger(1);
        return boards.stream().map(lb -> LeaderboardResponse.builder()
                .rank(rank.getAndIncrement())
                .userId(lb.getUser().getId())
                .username(lb.getUser().getUsername())
                .userFullName(lb.getUser().getFullName())
                .totalScore(lb.getTotalScore())
                .quizzesAttempted(lb.getQuizzesAttempted())
                .subjectName("Global")
                .build()).collect(Collectors.toList());
    }

    @Override
    public List<LeaderboardResponse> getSubjectLeaderboard(Long subjectId) {
        List<Leaderboard> boards = leaderboardRepository.findBySubjectIdOrderByTotalScoreDesc(subjectId);
        AtomicInteger rank = new AtomicInteger(1);
        return boards.stream().map(lb -> LeaderboardResponse.builder()
                .rank(rank.getAndIncrement())
                .userId(lb.getUser().getId())
                .username(lb.getUser().getUsername())
                .userFullName(lb.getUser().getFullName())
                .totalScore(lb.getTotalScore())
                .quizzesAttempted(lb.getQuizzesAttempted())
                .subjectName(lb.getSubject() != null ? lb.getSubject().getName() : "Global")
                .build()).collect(Collectors.toList());
    }
}
