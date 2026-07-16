package com.smartquiz.portal.service;

import com.smartquiz.portal.entity.Result;
import java.util.List;

public interface ExportService {
    byte[] exportResultsToExcel(List<Result> results);
    byte[] exportResultToPdf(Long attemptId);
    List<Result> getAllResults();
    List<Result> getResultsByQuiz(Long quizId);
    List<Result> getResultsByUser(Long userId);
}
