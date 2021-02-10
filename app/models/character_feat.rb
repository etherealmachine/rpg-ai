# == Schema Information
#
# Table name: character_feats
#
#  character_id :integer          not null
#  feat_id      :integer          not null
#  level        :integer
#
class CharacterFeat < ApplicationRecord
  belongs_to :character
  belongs_to :feat
end
