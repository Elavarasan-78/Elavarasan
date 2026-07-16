package com.smartquiz.portal.repository;

import com.smartquiz.portal.entity.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByUserId(Long userId);
    List<Result> findByQuizId(Long quizId);
    Optional<Result> findByQuizAttemptId(Long quizAttemptId);
}
