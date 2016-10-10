@extends('emails.layout')

@section('title', 'Altitude')

@section('content')
    <h3>Hi {{$name}}</h3>
    <h2>Welcome to Altitude</h2>
    <p>Click on the link below to get started.</p>
    @include('emails.form.button', ['label' => 'Get Started', 'link' => $url_link])
@stop
