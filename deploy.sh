#!/bin/bash
cd /home/devbox/project
export DATABASE_URL='postgresql://postgres:ssxvtvpz@time-echo-db-postgresql.ns-z2ypacm8.svc:5432/postgres'
npx prisma db push --skip-generate
