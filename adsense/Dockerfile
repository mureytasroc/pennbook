FROM python:3.9-buster

ENV POETRY_VERSION=1.0.8

RUN pip install "poetry==$POETRY_VERSION"

WORKDIR /app/

COPY ./pyproject.toml /app/
COPY ./poetry.lock /app/

RUN poetry install

COPY . /app/

CMD ["poetry", "run", "uvicorn", "serve:app", "--host", "0.0.0.0", "--port", "8001"]