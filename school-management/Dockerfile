# ─────────────────────────────────────────────
# Stage 1: builder — build JAR với Maven
# ─────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper và pom trước để cache layer deps
COPY school-management/mvnw school-management/mvnw.cmd school-management/pom.xml ./
COPY school-management/.mvn .mvn

# Download deps (cache layer riêng)
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source và build (bỏ qua tests)
COPY school-management/src ./src
RUN ./mvnw package -DskipTests -B

# ─────────────────────────────────────────────
# Stage 2: runner — JRE tối giản
# ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

# Tạo user non-root
RUN addgroup --system --gid 1001 spring \
 && adduser  --system --uid 1001 spring

# Copy JAR từ builder
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring

EXPOSE 8080

# JVM tuning cho container nhỏ
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
