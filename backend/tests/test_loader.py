from src.data.loader import USERS, MOVIES, RATINGS

def test_movielens_schemas_have_expected_columns():
    assert USERS.fieldNames() == ["user_id", "gender", "age", "occupation", "zip_code"]
    assert MOVIES.fieldNames() == ["movie_id", "title", "genres"]
    assert RATINGS.fieldNames() == ["user_id", "movie_id", "rating", "timestamp"]
