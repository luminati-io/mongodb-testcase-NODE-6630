# mongodb-testcase-NODE-6630
Containerized script to reproduce NODE-6630 mongodb package issue (https://jira.mongodb.org/browse/NODE-6630) 

# How to run

```bash
docker build -t mongodb-testcase-6630 .
docker run --rm -it mongodb-testcase-6630
```
or one liner:
```bash
docker run --rm -it $(docker build -q .)
```

Ctrl+c to exit.
