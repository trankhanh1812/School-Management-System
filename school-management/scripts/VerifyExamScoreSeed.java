import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class VerifyExamScoreSeed {
    public static void main(String[] args) throws Exception {
        if (args.length < 3) {
            System.err.println("Usage: VerifyExamScoreSeed <jdbcUrl> <user> <password>");
            System.exit(1);
        }

        String jdbcUrl = args[0];
        String user = args[1];
        String password = args[2];

        try (Connection conn = DriverManager.getConnection(jdbcUrl, user, password);
             Statement st = conn.createStatement()) {

            printCount(st, "Exams HK1 2026-2027", """
                SELECT count(*)
                FROM exams e
                JOIN semesters s ON s.id = e.semester_id
                JOIN academic_year ay ON ay.id = s.academic_year_id
                WHERE ay.code = '2026-2027' AND s.code = 'HK1' AND e.deleted_at IS NULL
                """);

            printCount(st, "Exam-Class mapping HK1", """
                SELECT count(*)
                FROM exam_class ec
                JOIN exams e ON e.id = ec.exam_id
                JOIN semesters s ON s.id = e.semester_id
                JOIN academic_year ay ON ay.id = s.academic_year_id
                WHERE ay.code = '2026-2027' AND s.code = 'HK1'
                """);

            printCount(st, "Scores HK1", """
                SELECT count(*)
                FROM scores sc
                JOIN exams e ON e.id = sc.exam_id
                JOIN semesters s ON s.id = e.semester_id
                JOIN academic_year ay ON ay.id = s.academic_year_id
                WHERE ay.code = '2026-2027' AND s.code = 'HK1' AND sc.deleted_at IS NULL
                """);

            printCount(st, "Score history HK1", """
                SELECT count(*)
                FROM score_history sh
                JOIN scores sc ON sc.id = sh.score_id
                JOIN exams e ON e.id = sc.exam_id
                JOIN semesters s ON s.id = e.semester_id
                JOIN academic_year ay ON ay.id = s.academic_year_id
                WHERE ay.code = '2026-2027' AND s.code = 'HK1'
                """);

            printCount(st, "Score approval logs HK1", """
                SELECT count(*)
                FROM score_approval_log sal
                JOIN scores sc ON sc.id = sal.score_id
                JOIN exams e ON e.id = sc.exam_id
                JOIN semesters s ON s.id = e.semester_id
                JOIN academic_year ay ON ay.id = s.academic_year_id
                WHERE ay.code = '2026-2027' AND s.code = 'HK1'
                """);

            System.out.println("\nMau du lieu diem (10 dong):");
            try (ResultSet rs = st.executeQuery("""
                SELECT
                  c.class_code,
                  st.student_code,
                  sub.code AS subject_code,
                  e.exam_type,
                  sc.score_value,
                  sc.absent_flag,
                  t.teacher_code
                FROM scores sc
                JOIN students st ON st.id = sc.student_id
                JOIN classes c ON c.id = sc.class_id
                JOIN exams e ON e.id = sc.exam_id
                JOIN subjects sub ON sub.id = e.subject_id
                JOIN teachers t ON t.id = sc.teacher_id
                JOIN semesters s ON s.id = e.semester_id
                JOIN academic_year ay ON ay.id = s.academic_year_id
                WHERE ay.code = '2026-2027' AND s.code = 'HK1'
                ORDER BY c.class_code, st.student_code, sub.code, e.exam_type
                LIMIT 10
                """)) {
                while (rs.next()) {
                    System.out.println(
                        "- Lop " + rs.getString("class_code")
                            + " | HS " + rs.getString("student_code")
                            + " | Mon " + rs.getString("subject_code")
                            + " | " + rs.getString("exam_type")
                            + " | Diem " + rs.getBigDecimal("score_value")
                            + " | Vang " + rs.getBoolean("absent_flag")
                            + " | GV " + rs.getString("teacher_code")
                    );
                }
            }
        }
    }

    private static void printCount(Statement st, String label, String sql) throws Exception {
        try (ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            System.out.println(label + ": " + rs.getInt(1));
        }
    }
}
