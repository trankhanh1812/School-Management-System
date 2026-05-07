import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class RunSqlScript {
    public static void main(String[] args) throws Exception {
        if (args.length < 4) {
            System.err.println("Usage: RunSqlScript <jdbcUrl> <user> <password> <scriptPath>");
            System.exit(1);
        }

        String jdbcUrl = args[0];
        String user = args[1];
        String password = args[2];
        String scriptPath = args[3];

        String sql = Files.readString(Path.of(scriptPath));
        StringBuilder cleaned = new StringBuilder();
        for (String line : sql.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("--")) {
                continue;
            }
            cleaned.append(line).append('\n');
        }
        String[] statements = cleaned.toString().split(";");

        try (Connection conn = DriverManager.getConnection(jdbcUrl, user, password);
             Statement stmt = conn.createStatement()) {
            conn.setAutoCommit(false);
            int executed = 0;

            for (String raw : statements) {
                String s = raw.trim();
                if (s.isEmpty() || s.startsWith("--")) {
                    continue;
                }
                stmt.execute(s);
                executed++;
            }

            conn.commit();
            System.out.println("Executed statements: " + executed);
            System.out.println("Script completed successfully.");
        }
    }
}
