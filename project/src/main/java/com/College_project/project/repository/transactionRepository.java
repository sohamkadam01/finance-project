package com.College_project.project.repository;

import com.College_project.project.models.Category;
import com.College_project.project.models.Transaction;
import com.College_project.project.models.User;
import com.College_project.project.enums.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface transactionRepository extends JpaRepository<Transaction, Long> {
    
    // Existing methods
    List<Transaction> findByUser(User user);
    List<Transaction> findByUserAndTransactionDateBetween(User user, LocalDate startDate, LocalDate endDate);
    List<Transaction> findByUserAndType(User user, TransactionType type);
    
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = :type AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndTypeAndDateRange(@Param("user") User user, 
                                                   @Param("type") TransactionType type, 
                                                   @Param("startDate") LocalDate startDate, 
                                                   @Param("endDate") LocalDate endDate);
    
    @Query("SELECT t FROM Transaction t WHERE t.user = :user AND t.isFlagged = true")
    List<Transaction> findFlaggedTransactions(@Param("user") User user);
    
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.category = :category AND t.type = :type AND t.transactionDate BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndCategoryAndDateRange(@Param("user") User user,
                                                       @Param("category") Category category,
                                                       @Param("type") TransactionType type,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);
    
    // NEW METHODS FOR ANOMALY DETECTION
    
    // Find transactions by user and creation date after a specific time
    List<Transaction> findByUserAndCreatedAtAfter(User user, LocalDateTime dateTime);
    
    // Find transactions by date after a specific date
    List<Transaction> findByTransactionDateAfter(LocalDate date);
    
    // Find transactions by user and date range with ordering
    List<Transaction> findByUserAndTransactionDateBetweenOrderByTransactionDateDesc(User user, LocalDate startDate, LocalDate endDate);
    
    // Find recent transactions for a user
    List<Transaction> findTop10ByUserOrderByCreatedAtDesc(User user);
    
    // Find transactions by amount greater than threshold
    List<Transaction> findByUserAndAmountGreaterThan(User user, BigDecimal amount);
    
    // Count transactions in a time period
    long countByUserAndCreatedAtAfter(User user, LocalDateTime dateTime);
    
    // ✅ ADD THIS METHOD - Count total transactions for a user
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.user.userId = :userId")
    long countByUser(@Param("userId") Long userId);
    
    // Advanced filtering with pagination
    @Query("SELECT t FROM Transaction t WHERE t.user = :user " +
           "AND (:search IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:categoryId IS NULL OR t.category.categoryId = :categoryId) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate) " +
           "AND (:accountId IS NULL OR t.bankAccount.accountId = :accountId) " +
           "AND (:minAmount IS NULL OR t.amount >= :minAmount) " +
           "AND (:maxAmount IS NULL OR t.amount <= :maxAmount)")
    Page<Transaction> findTransactionsWithFilters(
            @Param("user") User user,
            @Param("search") String search,
            @Param("type") TransactionType type,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("accountId") Long accountId,
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount,
            Pageable pageable);
    
    // Get summary statistics for filtered transactions
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user " +
           "AND t.type = 'INCOME' " +
           "AND (:search IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR t.category.categoryId = :categoryId) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate)")
    BigDecimal getTotalIncomeForFilters(
            @Param("user") User user,
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user " +
           "AND t.type = 'EXPENSE' " +
           "AND (:search IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR t.category.categoryId = :categoryId) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate)")
    BigDecimal getTotalExpenseForFilters(
            @Param("user") User user,
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    // Get most common category
    @Query("SELECT t.category.name, COUNT(t) FROM Transaction t WHERE t.user = :user " +
           "AND t.type = 'EXPENSE' " +
           "AND (:search IS NULL OR LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate) " +
           "GROUP BY t.category.name ORDER BY COUNT(t) DESC")
    List<Object[]> getMostCommonCategory(
            @Param("user") User user,
            @Param("search") String search,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}