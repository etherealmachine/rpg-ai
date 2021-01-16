# == Schema Information
#
# Table name: tilemaps
#
#  id            :integer          not null, primary key
#  user_id       :integer
#  name          :string
#  description   :string
#  orientation   :string
#  width         :integer
#  height        :integer
#  hexsidelength :integer
#  staggeraxis   :string
#  staggerindex  :string
#  tilewidth     :integer
#  tileheight    :integer
#  properties    :string
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#
require 'rails_helper'
RSpec.describe Tilemap, type: :model do
  context 'from file' do
    it 'should create a tilemap' do
      tilemap = Tilemap.new(user: User.create!(email: "etherealmachine@gmail.com", password: "123456"))
      file = fixture_file_upload('temple_of_clanggedin.tmx', 'application/octet-stream')
      tilemap.from_file!(file)
      expect(tilemap.definition).to be_attached
    end
  end

  context 'from files' do
    it 'should create a tilemap and associated tilesets' do
      tilemap = Tilemap.new(user: User.create!(email: "etherealmachine@gmail.com", password: "123456"))
      files = [
        fixture_file_upload('temple_of_clanggedin.tmx', 'application/octet-stream'),
        fixture_file_upload('kenney_roguelike.tsx', 'application/octet-stream'),
        fixture_file_upload('kenney_roguelike.png', 'image/png'),
        fixture_file_upload('kenney_caves.tsx', 'application/octet-stream'),
        fixture_file_upload('kenney_caves.png', 'image/png'),
      ]
      tilemap.from_files!(files)
      tilemap.tilesets.each do |tileset|
        expect(tileset.tileset).to be_present
      end
    end
  end
end
