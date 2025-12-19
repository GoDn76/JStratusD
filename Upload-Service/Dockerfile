FROM eclipse-temurin:21-jre-jammy
LABEL authors="Gaurav Urmaliya"

# Install Node.js and npm
RUN apt-get update \
    && apt-get install -y redis-tools redis-server


WORKDIR /app
COPY target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]

EXPOSE 8080