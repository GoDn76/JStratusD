#FROM eclipse-temurin:21-jre-jammy
#LABEL authors="Gaurav Urmaliya"
#
## Install dependencies for running npm builds
#RUN apt-get update \
#    && apt-get install -y curl \
#    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
#    && apt-get install -y nodejs
#
#WORKDIR /app
#COPY target/Vercel-Deploy-Service-3.5.0.jar app.jar
#
#ENTRYPOINT ["java", "-jar", "app.jar"]
#
## Expose the port the app runs on
#EXPOSE 8081

FROM eclipse-temurin:21-jre-jammy
LABEL authors="Gaurav Urmaliya"

# 1. Install dependencies for nvm (curl and bash are required)
RUN apt-get update && apt-get install -y curl bash libatomic1

# 2. Set the NVM_DIR environment variable
# This is where nvm will be installed and looked for.
ENV NVM_DIR /root/.nvm

# 3. Install nvm
# This runs the official install script inside the image.
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Notice: We are NOT installing nodejs here. That's nvm's job,
# which will be run by your Java code.

WORKDIR /app
COPY target/Vercel-Deploy-Service-3.5.0.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]

# Expose the port the app runs on
EXPOSE 8081