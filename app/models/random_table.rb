# == Schema Information
#
# Table name: random_tables
#
#  id         :integer          not null, primary key
#  name       :string
#  source_id  :integer
#  roll       :string
#  columns    :json
#  table      :json
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class RandomTable < ApplicationRecord
  belongs_to :source

  def generate
    match = /(\d+)d(\d+)/.match roll
    num, die = match[1].to_i, match[2].to_i
    total = (1..num).map { rand(die)+1 }.sum
    row = table[total.to_s]
    return row if row.kind_of? Hash
    Hash[columns.each_with_index.map do |col, i| 
      [col, row[i]]
    end]
  end

  def map_reference(ref)
    if ref.kind_of? Hash
      return "RandomTable:#{ref['id']}"
    end
    m = Monster.find_by(name: ref)
    if m.present?
      return "Monster:#{m.id}"
    end
    ref.to_s
  end

  before_validation do
    self.table = Hash[self.table.entries.map do |key, row|
      if row.kind_of? String
        [key, map_reference(row)]
      elsif row.kind_of? Hash
        [key, Hash[row.entries.map do |key, val|
          [map_reference(key), val]
        end]]
      elsif row.kind_of? Array
        [key, row.map { |val| map_reference(val) }]
      end
    end]
  end

end
