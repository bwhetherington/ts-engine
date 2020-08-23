IMAGE_NAME='bwhetherington/game-server'
CONTAINER_NAME='game-server'

docker build -t $IMAGE_NAME .
docker kill $CONTAINER_NAME
docker rm $CONTAINER_NAME
docker run -p 8080:8080 --restart unless-stopped --name $CONTAINER_NAME -d $IMAGE_NAME