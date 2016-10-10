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
                {{$user->created_at}}
            </td>
        </tr>
        <tr>
            <th>
                Email
            </th>
            <td>
                {{$user->email}}
            </td>
        </tr>
        <tr>
            <th>
                Subject
            </th>
            <td>
                {{$user->email}}
            </td>
        </tr>
        <tr>
            <th>
                Roles
            </th>
            <td>
                @foreach ($user->roles as $role)
                    {{$role}},
                @endforeach
            </td>
        </tr>
        <tr>
            <th>
                Company
            </th>
            <td>
                {{$user->company}}
            </td>
        </tr>
        <tr>
            <th>
                Versions
            </th>
            <td>
                @foreach ($data['versions'] as $version)
                    <a href="/admin/users/{{$version->key}}">{{$version->key}}</a></br>
                @endforeach
            </td>
        </tr>
    </table>
    <hr />
</div>

@stop