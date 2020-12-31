require "test_helper"

class TilemapsControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get tilemaps_new_url
    assert_response :success
  end

  test "should get edit" do
    get tilemaps_edit_url
    assert_response :success
  end

  test "should get show" do
    get tilemaps_show_url
    assert_response :success
  end

  test "should get destroy" do
    get tilemaps_destroy_url
    assert_response :success
  end
end
