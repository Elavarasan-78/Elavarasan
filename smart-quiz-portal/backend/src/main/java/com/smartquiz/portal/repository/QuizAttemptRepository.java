package com.smartquiz.portal.repository;

import com.smartquiz.portal.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserId(Long userId);
    List<QuizAttempt> findByQuizId(Long quizId);
    List<QuizAttempt> findByUserIdAndQuizId(Long userId, Long quizId);
    long countByUserIdAndQuizIdAndIsCompleted(Long userId, Long quizId, boolean isCompleted);
}
