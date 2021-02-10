Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: :users }
  devise_scope :user do
    get 'profile', to: 'users#show'
  end
  resources :tilesets
  resources :tilemaps
  resources :tilemap_tilesets, only: [:update]
  resources :monsters, only: [:index, :show]
  resources :spells, only: [:index, :show]
  resources :encounters, only: [:index]
  resources :tags
  post 'upload', to: 'upload#upload'
  get 'about', to: 'home#about'
  get 'terms_of_use', to: 'home#terms_of_use'
  root to: "home#index"
end
