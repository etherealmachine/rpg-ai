require "test_helper"

class TilesetsControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get tilesets_new_url
    assert_response :success
  end

  test "should get edit" do
    get tilesets_edit_url
    assert_response :success
  end

  test "should get show" do
    get tilesets_show_url
    assert_response :success
  end

  test "should get destroy" do
    get tilesets_destroy_url
    assert_response :success
  end
end
