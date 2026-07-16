package com.smartquiz.portal.controller;

import com.smartquiz.portal.dto.*;
import com.smartquiz.portal.entity.User;
import com.smartquiz.portal.exception.ResourceNotFoundException;
import com.smartquiz.portal.repository.UserRepository;
import com.smartquiz.portal.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "Candidate portal APIs")
public class UserController {

    private final QuizService quizService;
    private final QuestionService questionService;
    private final AttemptService attemptService;
    private final AnalyticsService analyticsService;
    private final CategoryService categoryService;
    private final SubjectService subjectService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExportService exportService;

    // === QUIZ BROWSING ===
    @GetMapping("/quizzes")
    @Operation(summary = "Get all published quizzes")
    public ResponseEntity<List<QuizDto>> getPublishedQuizzes() {
        return ResponseEntity.ok(quizService.getPublishedQuizzes());
    }

    @GetMapping("/quizzes/{id}")
    public ResponseEntity<QuizDto> getQuizById(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    @GetMapping("/quizzes/{id}/can-attempt")
    @Operation(summary = "Check if the current user can attempt a quiz")
    public ResponseEntity<Map<String, Boolean>> canAttempt(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        boolean canAttempt = attemptService.canAttemptQuiz(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("canAttempt", canAttempt));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryDto>> getCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectDto>> getSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    // === EXAM ===
    @PostMapping("/quizzes/{quizId}/start")
    @Operation(summary = "Start a quiz attempt")
    public ResponseEntity<QuizAttemptResponse> startAttempt(@PathVariable Long quizId, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(attemptService.startAttempt(quizId, userDetails.getUsername()));
    }

    @GetMapping("/quizzes/{quizId}/questions")
    @Operation(summary = "Get quiz questions (for exam interface)")
    public ResponseEntity<List<QuestionDto>> getQuizQuestions(@PathVariable Long quizId) {
        return ResponseEntity.ok(questionService.getQuestionsByQuiz(quizId));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    @Operation(summary = "Submit quiz attempt with answers")
    public ResponseEntity<QuizAttemptResponse> submitAttempt(
            @PathVariable Long attemptId,
            @RequestBody List<AnswerSubmitDto> answers,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(attemptService.submitAttempt(attemptId, answers, userDetails.getUsername()));
    }

    @GetMapping("/attempts/{attemptId}/result")
    @Operation(summary = "Get result of a specific attempt")
    public ResponseEntity<QuizAttemptResponse> getAttemptResult(@PathVariable Long attemptId, @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(attemptService.getAttemptResult(attemptId, userDetails.getUsername()));
    }

    @GetMapping("/my-attempts")
    @Operation(summary = "Get all quiz attempts for current user")
    public ResponseEntity<List<QuizAttemptResponse>> getMyAttempts(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(attemptService.getUserAttempts(userDetails.getUsername()));
    }

    // === LEADERBOARD ===
    @GetMapping("/leaderboard/global")
    public ResponseEntity<List<LeaderboardResponse>> getGlobalLeaderboard() {
        return ResponseEntity.ok(analyticsService.getGlobalLeaderboard());
    }

    @GetMapping("/leaderboard/subject/{subjectId}")
    public ResponseEntity<List<LeaderboardResponse>> getSubjectLeaderboard(@PathVariable Long subjectId) {
        return ResponseEntity.ok(analyticsService.getSubjectLeaderboard(subjectId));
    }

    // === PROFILE ===
    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<User> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update user profile")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> body) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (body.containsKey("fullName")) user.setFullName(body.get("fullName"));
        if (body.containsKey("email")) user.setEmail(body.get("email"));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/profile/change-password")
    @Operation(summary = "Change user password")
    public ResponseEntity<Map<String, String>> changePassword(@AuthenticationPrincipal UserDetails userDetails, @RequestBody Map<String, String> body) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(body.get("currentPassword"), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
        }
        user.setPassword(passwordEncoder.encode(body.get("newPassword")));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // === RESULT PDF EXPORT ===
    @GetMapping("/attempts/{attemptId}/export/pdf")
    public ResponseEntity<byte[]> exportResultPdf(@PathVariable Long attemptId) {
        byte[] pdf = exportService.exportResultToPdf(attemptId);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=result_" + attemptId + ".pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
