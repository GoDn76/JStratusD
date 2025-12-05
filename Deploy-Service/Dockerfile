FROM eclipse-temurin:21-jre-alpine
LABEL authors="Gaurav Urmaliya"


RUN apk add --no-cache nodejs npm bash

# 2. Verify installation
RUN node -v && npm -v

WORKDIR /app
COPY target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]

# Expose the port the app runs on
EXPOSE 8082