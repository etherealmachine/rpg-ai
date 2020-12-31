# == Schema Information
#
# Table name: tilesets
#
#  id          :integer          not null, primary key
#  user_id     :integer
#  name        :string
#  description :string
#  margin      :integer
#  spacing     :integer
#  tilewidth   :integer
#  tileheight  :integer
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
require "test_helper"

class TilesetTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
