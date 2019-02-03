NAME=goodgame-chat
CONTAINER=peka2tv/goodgame-chat

remove:
	-docker stop $(NAME)
	-docker rm $(NAME)
build: remove
	-docker rmi $(CONTAINER)
	docker build --force-rm --tag $(CONTAINER) .

run: remove
	docker run \
		--net=host \
		--name $(NAME) \
		--restart unless-stopped \
		--cap-add=SYS_ADMIN \
		-d $(CONTAINER)
