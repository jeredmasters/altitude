@extends('admin.layout')

@section('content')
<div class="col-lg-12">
    <a href="/admin/users" class="btn btn-default">
        <span class="glyphicon glyphicon-triangle-left" aria-hidden="true"></span>
        Users
    </a>
    <table class="table table-striped">
        <tr>
            <th>
                Created Date
            </th>
            <td>
                {{$company->created_at}}
            </td>
        </tr>
        <tr>
            <th>
                Title
            </th>
            <td>
                {{$company->title}}
            </td>
        </tr>
        <tr>
            <th>
                Guid
            </th>
            <td>
                {{$company->guid}}
            </td>
        </tr>
        <tr>
            <th>
                Subscription Plan
            </th>
            <td>
                {{$company->subscription_plan}}
            </td>
        </tr>
        <tr>
            <th>
                Users
            </th>
            <td>
                @foreach ($data['users'] as $user)
                    <a href="/admin/users/{{$user->key_base}}">{{$user->fullname}} ({{$user->email}})</a></br>
                @endforeach
            </td>
        </tr>
        <tr>
            <th>
                Scaffolds
            </th>
            <td>
                @foreach ($data['scaffolds'] as $scaffold)
                    <a href="/admin/scaffold/{{$scaffold->key_base}}">{{$scaffold->title}} ({{$scaffold->key_base}})</a></br>
                @endforeach
            </td>
        </tr>
 
    </table>
    <hr />
</div>

@stop