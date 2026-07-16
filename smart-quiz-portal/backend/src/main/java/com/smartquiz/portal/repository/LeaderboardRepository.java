package com.smartquiz.portal.repository;

import com.smartquiz.portal.entity.Leaderboard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LeaderboardRepository extends JpaRepository<Leaderboard, Long> {
    List<Leaderboard> findBySubjectIsNullOrderByTotalScoreDesc();
    List<Leaderboard> findBySubjectIdOrderByTotalScoreDesc(Long subjectId);
    Optional<Leaderboard> findByUserIdAndSubjectId(Long userId, Long subjectId);
    Optional<Leaderboard> findByUserIdAndSubjectIsNull(Long userId);
}
