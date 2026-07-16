package com.smartquiz.portal.controller;

import com.smartquiz.portal.dto.*;
import com.smartquiz.portal.entity.Result;
import com.smartquiz.portal.entity.User;
import com.smartquiz.portal.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin management APIs")
public class AdminController {

    private final AuthService authService;
    private final CategoryService categoryService;
    private final SubjectService subjectService;
    private final QuizService quizService;
    private final QuestionService questionService;
    private final AnalyticsService analyticsService;
    private final ExportService exportService;

    // === USER MANAGEMENT ===
    @GetMapping("/users")
    @Operation(summary = "Get all users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/search")
    @Operation(summary = "Search users by name or username")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(authService.searchUsers(query));
    }

    @PutMapping("/users/{id}/toggle-status")
    @Operation(summary = "Activate or deactivate a user")
    public ResponseEntity<User> toggleUserStatus(@PathVariable Long id, @RequestParam boolean active) {
        return ResponseEntity.ok(authService.toggleUserStatus(id, active));
    }

    @PutMapping("/users/{id}/reset-password")
    @Operation(summary = "Reset user password")
    public ResponseEntity<Map<String, String>> resetUserPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        authService.resetUserPassword(id, body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    // === CATEGORY MANAGEMENT ===
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryDto> createCategory(@Valid @RequestBody CategoryDto dto) {
        return ResponseEntity.ok(categoryService.createCategory(dto));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryDto> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryDto dto) {
        return ResponseEntity.ok(categoryService.updateCategory(id, dto));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted successfully"));
    }

    // === SUBJECT MANAGEMENT ===
    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectDto>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @PostMapping("/subjects")
    public ResponseEntity<SubjectDto> createSubject(@Valid @RequestBody SubjectDto dto) {
        return ResponseEntity.ok(subjectService.createSubject(dto));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<SubjectDto> updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectDto dto) {
        return ResponseEntity.ok(subjectService.updateSubject(id, dto));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Map<String, String>> deleteSubject(@PathVariable Long id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.ok(Map.of("message", "Subject deleted successfully"));
    }

    // === QUIZ MANAGEMENT ===
    @GetMapping("/quizzes")
    public ResponseEntity<List<QuizDto>> getAllQuizzes() {
        return ResponseEntity.ok(quizService.getAllQuizzes());
    }

    @GetMapping("/quizzes/{id}")
    public ResponseEntity<QuizDto> getQuizById(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    @PostMapping("/quizzes")
    public ResponseEntity<QuizDto> createQuiz(@Valid @RequestBody QuizDto dto) {
        return ResponseEntity.ok(quizService.createQuiz(dto));
    }

    @PutMapping("/quizzes/{id}")
    public ResponseEntity<QuizDto> updateQuiz(@PathVariable Long id, @Valid @RequestBody QuizDto dto) {
        return ResponseEntity.ok(quizService.updateQuiz(id, dto));
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Map<String, String>> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok(Map.of("message", "Quiz deleted successfully"));
    }

    @PutMapping("/quizzes/{id}/publish")
    public ResponseEntity<QuizDto> publishQuiz(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.publishQuiz(id));
    }

    @PutMapping("/quizzes/{id}/unpublish")
    public ResponseEntity<QuizDto> unpublishQuiz(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.unpublishQuiz(id));
    }

    @PostMapping("/quizzes/{id}/duplicate")
    public ResponseEntity<QuizDto> duplicateQuiz(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.duplicateQuiz(id));
    }

    // === QUESTION MANAGEMENT ===
    @GetMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<List<QuestionDto>> getQuestions(@PathVariable Long quizId) {
        return ResponseEntity.ok(questionService.getQuestionsByQuiz(quizId));
    }

    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<QuestionDto> addQuestion(@PathVariable Long quizId, @Valid @RequestBody QuestionDto dto) {
        return ResponseEntity.ok(questionService.createQuestion(quizId, dto));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<QuestionDto> updateQuestion(@PathVariable Long id, @Valid @RequestBody QuestionDto dto) {
        return ResponseEntity.ok(questionService.updateQuestion(id, dto));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Map<String, String>> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(Map.of("message", "Question deleted successfully"));
    }

    @PostMapping("/quizzes/{quizId}/questions/bulk-upload")
    public ResponseEntity<Map<String, String>> bulkUploadQuestions(@PathVariable Long quizId, @RequestParam("file") MultipartFile file) throws IOException {
        questionService.bulkUploadQuestions(quizId, file);
        return ResponseEntity.ok(Map.of("message", "Questions uploaded successfully"));
    }

    @GetMapping("/questions/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        byte[] template = questionService.exportQuestionsTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=questions_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    // === ANALYTICS ===
    @GetMapping("/analytics")
    public ResponseEntity<DashboardAnalyticsDto> getDashboardAnalytics() {
        return ResponseEntity.ok(analyticsService.getAdminDashboardAnalytics());
    }

    @GetMapping("/leaderboard/global")
    public ResponseEntity<List<LeaderboardResponse>> getGlobalLeaderboard() {
        return ResponseEntity.ok(analyticsService.getGlobalLeaderboard());
    }

    @GetMapping("/leaderboard/subject/{subjectId}")
    public ResponseEntity<List<LeaderboardResponse>> getSubjectLeaderboard(@PathVariable Long subjectId) {
        return ResponseEntity.ok(analyticsService.getSubjectLeaderboard(subjectId));
    }

    // === RESULTS / EXPORT ===
    @GetMapping("/results")
    public ResponseEntity<List<Result>> getAllResults() {
        return ResponseEntity.ok(exportService.getAllResults());
    }

    @GetMapping("/results/quiz/{quizId}")
    public ResponseEntity<List<Result>> getResultsByQuiz(@PathVariable Long quizId) {
        return ResponseEntity.ok(exportService.getResultsByQuiz(quizId));
    }

    @GetMapping("/results/export/excel")
    public ResponseEntity<byte[]> exportResultsExcel() {
        List<Result> results = exportService.getAllResults();
        byte[] data = exportService.exportResultsToExcel(results);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=results.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/results/export/pdf/{attemptId}")
    public ResponseEntity<byte[]> exportResultPdf(@PathVariable Long attemptId) {
        byte[] pdf = exportService.exportResultToPdf(attemptId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=result_" + attemptId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
