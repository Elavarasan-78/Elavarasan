package com.smartquiz.portal.repository;

import com.smartquiz.portal.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByQuizAttemptId(Long quizAttemptId);
}
