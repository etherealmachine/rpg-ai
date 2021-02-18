class CreateRandomTable < ActiveRecord::Migration[6.1]
  def change
    create_table :random_tables do |t|
      t.string :name
      t.references :source
      t.string :roll
      t.json :columns
      t.json :table
      t.timestamps
    end
  end
end
