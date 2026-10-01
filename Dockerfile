# ==============================================================================
# Multi-stage Dockerfile for Bank Account Management System (Render Deployment)
# ==============================================================================

# Stage 1: Build the Application
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /workspace

# Copy root repository files (including frontend and backend)
COPY . .

# Build the Spring Boot executable jar skipping unit tests
RUN cd backend && mvn clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Non-root user for security
RUN useradd -m -u 1001 appuser

# Copy the built jar from builder stage
COPY --from=builder /workspace/backend/target/bank-account-management-1.0.0.jar /app/app.jar

# Ownership
RUN chown -R appuser:appuser /app
USER appuser

# Default port (Render overrides PORT at runtime)
ENV PORT=8081
EXPOSE 8081

# Launch application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
