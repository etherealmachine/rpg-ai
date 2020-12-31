Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: :users }
  devise_scope :user do
    get 'profile', to: 'users#show'
  end
  resources :tilesets
  resources :tilemaps
  resources :tilemap_tilesets, only: [:update]
  resources :tags
  root to: "home#index"
end
