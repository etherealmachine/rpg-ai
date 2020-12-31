# == Schema Information
#
# Table name: tilemaps
#
#  id          :integer          not null, primary key
#  user_id     :integer
#  name        :string
#  description :string
#  orientation :string
#  width       :integer
#  height      :integer
#  tilewidth   :integer
#  tileheight  :integer
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
require "test_helper"

class TilemapTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
