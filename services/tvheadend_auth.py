import os

def get_tvh_auth():
    username = os.environ["TVH_USERNAME"].strip()
    password = os.environ["TVH_PASSWORD"].strip()

    if (
        username
        and password
        and username.lower() != "none"
        and password.lower() != "none"
    ):
        return (username, password)

    return None