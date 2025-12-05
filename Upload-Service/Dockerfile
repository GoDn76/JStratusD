FROM eclipse-temurin:21-jre-jammy
LABEL authors="Gaurav Urmaliya"

# Install Node.js and npm
RUN apt-get update \
    && apt-get install -y redis-tools redis-server


WORKDIR /app
COPY . /app

# Run your Spring Boot app
CMD java -jar target/Vercel-Upload-Service-3.5.0.jar

EXPOSE 8080