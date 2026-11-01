# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=24

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine

# Set working directory for all build stages.
WORKDIR /home/app

# Run as the unprivileged "node" user (uid 1000) of the base image, not
# root: the app needs no privilege, and files it writes in mounted volumes
# (database, uploads) stay owned by a regular user on the host.
# The user owns the working directory before anything is installed: a
# chown afterwards would copy node_modules into a second layer.
RUN chown node:node /home/app
USER node

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to the npm cache of the "node" user to speed up subsequent builds.
# Leverage bind mounts to package.json and package-lock.json to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci

# Copy the rest of the source files into the image.
# .env and data/ are excluded (.dockerignore): settings come from the
# container environment, data from a volume.
COPY --chown=node:node . .

# Run the application.
# Shell form vs Exec form?
# See https://docs.docker.com/reference/build-checks/json-args-recommended/
CMD ["npm", "run", "dev"]
