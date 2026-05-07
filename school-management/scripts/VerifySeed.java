import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class VerifySeed {
    public static void main(String[] args) throws Exception {
        if (args.length < 3) {
            System.err.println("Usage: VerifySeed <jdbcUrl> <user> <password>");
            System.exit(1);
        }

        String jdbcUrl = args[0];
        String user = args[1];
        String password = args[2];

        try (Connection conn = DriverManager.getConnection(jdbcUrl, user, password);
             Statement st = conn.createStatement()) {

            printCount(st, "Lop khoi 10 (10A%)", """
                SELECT count(*)
                FROM classes c
                JOIN academic_year ay ON ay.id = c.academic_year_id
                WHERE ay.code = '2026-2027' AND c.class_code LIKE '10A%'
                """);

            printCount(st, "Lop khoi 11 (11A%)", """
                SELECT count(*)
                FROM classes c
                JOIN academic_year ay ON ay.id = c.academic_year_id
                WHERE ay.code = '2026-2027' AND c.class_code LIKE '11A%'
                """);

            printCount(st, "Lop khoi 12 (12A%)", """
                SELECT count(*)
                FROM classes c
                JOIN academic_year ay ON ay.id = c.academic_year_id
                WHERE ay.code = '2026-2027' AND c.class_code LIKE '12A%'
                """);

            printCount(st, "Tong hoc sinh HS0001..HS0360", """
                SELECT count(*)
                FROM students
                WHERE student_code BETWEEN 'HS0001' AND 'HS0360'
                """);

            printCount(st, "Tong phu huynh PH0001..PH0360", """
                SELECT count(*)
                FROM parents
                WHERE parent_code BETWEEN 'PH0001' AND 'PH0360'
                """);

            printCount(st, "Tong phan cong day HK1 2026-2027", """
                SELECT count(*)
                FROM teaching_assignment ta
                JOIN semesters s ON s.id = ta.semester_id
                JOIN academic_year ay ON ay.id = s.academic_year_id
                WHERE ay.code = '2026-2027' AND s.code = 'HK1'
                """);

            System.out.println("\nDanh sach 12 mon pho thong:");
            try (ResultSet rs = st.executeQuery("""
                SELECT code, name
                FROM subjects
                WHERE code IN ('TOAN','LY','HOA','SINH','VAN','ANH','SU','DIA','GDCD','TIN','CN','TD')
                ORDER BY code
                """)) {
                while (rs.next()) {
                    System.out.println("- " + rs.getString(1) + " | " + rs.getString(2));
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
