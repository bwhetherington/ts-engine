#!/bin/sh

kill $(ps -aux | grep nodemon | awk '{print $2}')
kill $(lsof -i :8000 | grep node | awk '{print $2}')