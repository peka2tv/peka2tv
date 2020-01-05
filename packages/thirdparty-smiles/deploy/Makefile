NAME=thirdparty-smiles
CONTAINER=peka2tv/thirdparty-smiles

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
